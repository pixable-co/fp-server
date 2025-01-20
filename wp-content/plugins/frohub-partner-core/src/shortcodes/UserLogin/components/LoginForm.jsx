import { useState } from "react";
import FhInput from "../../../common/controls/FhInput.jsx";
import FhButton from "../../../common/controls/FhButton.jsx";
import {loginWP} from "../../../services/loginWP.js";

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        console.log("login submitted");
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Call the loginWP function
        const result = await loginWP(email, password);

        if (result.success) {
            console.log(result.data);
            document.cookie = `token=${result.data.token}; path=/; Secure; SameSite=Strict`;
            window.location.href = "/financial-dashboard"; // Adjust based on your routing
        } else {
            // Handle error response
            setError(result.message);
        }

        setLoading(false);
    };


    return (
        <div className="flex flex-col items-center min-h-screen justify-center p-4 w-full">
            <div className="max-w-md w-full">
                <h1 className="text-center text-2xl font-semibold">FroHub</h1>
                <p className="text-center mb-8">Partners</p>

                <h2 className="font-medium mb-4 text-left">Log in to your Partner Account</h2>

                <form className="space-y-6">
                    <div>
                        <FhInput
                            placeholder={"Email Address"}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <FhInput
                            placeholder={"Password"}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-red-500 text-left">{error}</div>}

                    <div className="text-left">
                        <a href="#" className="hover:text-gray-700">
                            Forgotten Password
                        </a>
                    </div>

                    <FhButton
                        label={loading ? "Logging in..." : "Log in"}
                        type="submit"
                        disabled={loading}
                        onClick={handleSubmit}
                    />

                </form>

                <div className="text-left mt-6">
                    <p>
                        Not yet a Partner?{" "}
                        <a href="/auth/signup" className="font-semibold hover:text-gray-900">
                            Join for Free
                        </a>
                    </p>
                </div>

                <hr className="my-6 border-black" />

                <div className="text-left">
                    <p>
                        Looking to book a service?{" "}
                        <a href="https://frohub.com" target="_blank" className="font-semibold hover:text-gray-900">
                            Visit frohub.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;