<?php
namespace Pixable\Fpserver;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class MakeShortcodeCommand extends Command
{
    protected static $defaultName = 'wp-shaper:make-shortcode';

    public function __construct()
    {
        parent::__construct(self::$defaultName);
    }

    protected function configure(): void
    {
        $this
            ->setDescription('Generate a new shortcode and update class-shortcodes.php.')
            ->addArgument('name', InputArgument::REQUIRED, 'The name of the shortcode (use directory structure if needed, e.g., BookingForm/fh_submit_form)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $name = $input->getArgument('name');

        // Extract directory and filename
        $parts = explode('/', $name);
        $fileName = array_pop($parts); // Get the last part as the file name
        $directoryPath = implode(DIRECTORY_SEPARATOR, $parts); // Convert to OS-specific directory separator

        // Ensure the file name is all lowercase
        $fileName = strtolower($fileName);

        // Generate the class name in PascalCase
        $className = implode('', array_map('ucfirst', explode('_', $fileName)));

        // Define the base directory
        $baseDirectory = realpath(__DIR__ . '/../includes/shortcodes') . DIRECTORY_SEPARATOR;

        // Define the full file path
        $fullDirectoryPath = $baseDirectory . strtolower($directoryPath);
        $phpFilePath = rtrim($fullDirectoryPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . "{$fileName}.php";

        // Ensure the directory exists
        if (!is_dir($fullDirectoryPath)) {
            mkdir($fullDirectoryPath, 0755, true);
        }

        // Create the class-based shortcode PHP file
        $phpContent = <<<PHP
<?php
namespace FPServer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class {$className} {

    public static function init() {
        \$self = new self();
        add_shortcode( '{$fileName}', array(\$self, '{$fileName}_shortcode') );
    }

    public function {$fileName}_shortcode() {
        \$unique_key = '{$fileName}' . uniqid();
        return '<div class="{$fileName}" data-key="' . esc_attr(\$unique_key) . '"></div>';
    }
}

PHP;

        file_put_contents($phpFilePath, $phpContent);

        // Update class-shortcodes.php
        $shortcodeFilePath = realpath(__DIR__ . '/../includes/shortcodes') . DIRECTORY_SEPARATOR . 'class-shortcodes.php';

        if (file_exists($shortcodeFilePath)) {
            $shortcodeContent = file_get_contents($shortcodeFilePath);

            // Add the use statement if it doesn't exist
            $useStatement = "use FECore\\{$className};";
            if (strpos($shortcodeContent, $useStatement) === false) {
                $shortcodeContent = str_replace("namespace FECore;\n", "namespace FECore;\n\n{$useStatement}\n", $shortcodeContent);
                $output->writeln("Added use statement: {$useStatement}");
            }

            // Add the class initialization in the init() method
            $initStatement = "{$className}::init();";
            if (strpos($shortcodeContent, $initStatement) === false) {
                $shortcodeContent = preg_replace(
                    '/public static function init\(\) \{\n(.*?)\n\t\}/s',
                    "public static function init() {\n$1\n\t\t{$initStatement}\n\t}",
                    $shortcodeContent
                );

                if ($shortcodeContent === null) {
                    $output->writeln("Error: Failed to update init() method.");
                    return Command::FAILURE;
                }

                $output->writeln("Added init statement: {$initStatement}");
            }

            // Save the updated content
            if (file_put_contents($shortcodeFilePath, $shortcodeContent) === false) {
                $output->writeln("Error: Failed to write to 'class-shortcodes.php'. Check file permissions.");
                return Command::FAILURE;
            }

            $output->writeln("Successfully updated 'class-shortcodes.php'.");
        } else {
            $output->writeln("Error: 'class-shortcodes.php' does not exist.");
            return Command::FAILURE;
        }

        // Output success message
        $output->writeln("Class-based shortcode '{$fileName}' created and 'class-shortcodes.php' updated successfully:");
        $output->writeln("- PHP file created at: {$phpFilePath}");
        $output->writeln("- Updated: {$shortcodeFilePath}");

        return Command::SUCCESS;
    }
}
