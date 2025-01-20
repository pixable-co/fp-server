import LoginForm from "./components/LoginForm";
// import SignupForm from "@/app/auth/signup/components/SignupForm";

export default function UserLogin() {
    return (
        <div className="flex min-h-screen">
            {/* Left Section */}
            <div className="fh__background w-3/5 flex p-8" style={{ backgroundImage: `url('/images/signup/frohub_signup.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {/*<div className="text-left max-w-md">*/}
                {/*  <h1>FroHub</h1>*/}
                {/*  <h2 className="mt-6">*/}
                {/*    The #1 platform for Afro hairdressers and <br/> beauticians.*/}
                {/*  </h2>*/}
                {/*</div>*/}
            </div>

            {/* Right Section */}
            {/*<div className="w-4/6 flex items-center justify-center">*/}
            {/*  <LoginForm />*/}
            {/*</div>*/}

            {/* Right Section */}
            <div className="w-4/5 flex flex-col justify-between">
                <div className="absolute">
                    <div className="w-full ml-6 mt-16 font-medium">
                        <h1>FroHub</h1>
                        <h2 className="mt-6">
                            The #1 platform for Afro hairdressers and <br/> beauticians.
                        </h2>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <LoginForm/>
                </div>
            </div>
        </div>
    );
}