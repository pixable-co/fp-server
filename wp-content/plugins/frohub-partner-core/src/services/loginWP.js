// common/services/loginWP.js
export const loginWP = async (email, password) => {
    try {
        const response = await fetch(`https://frohub.com/wp-json/jwt-auth/v1/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: email,
                password: password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data.message || "An error occurred while logging in.",
            };
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Network error. Please try again.",
        };
    }
};