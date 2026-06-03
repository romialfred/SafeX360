import { Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { generatePassword } from "../../utility/OtherUtilities";
import { resetPassword } from "../../services/AccountService";
import { errorNotification, successNotification } from "../../utility/NotificationUtility";

import bgImg from "@/assets/Picture2.png";

import name from "@/assets/name.png";
const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const form = useForm({
        initialValues: {
            email: "",
            login: "",
            password: generatePassword()
        },
        validate: {
            email: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Email is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            login: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Login is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        setLoading(true);
        resetPassword(values).then((_res) => {
            successNotification("Temporary password sent to your email")
            navigate("/login")
        }).catch((err) => {
            errorNotification(err.response.data.errorMessage)
        }).finally(() => setLoading(false));
    };



    return <div style={{ backgroundImage: `url(${bgImg})` }} className="flex flex-col p-5 gap-5 items-center bg-light-bg min-h-screen justify-center bg-cover bg-center">
        <div className="flex gap-2 text-2xl h-32 items-center text-neutral-50">
            <img className="object-contain !h-24  rounded-2xl  !w-auto" src={name} alt="" />
        </div>
        <form onSubmit={form.onSubmit(handleSubmit)} className="w-[28rem] flex flex-col gap-5 bg-white p-7 shadow-md rounded-xl">
            <div className="text-2xl self-center  bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Reset Password</div>
            <TextInput size="md" {...form.getInputProps("email")} leftSection={<IconUser size={16} />} label="Email" withAsterisk placeholder="Enter email" rightSectionWidth="xl" />
            <TextInput size="md" {...form.getInputProps("login")} leftSection={<IconUser size={16} />} label="Login" withAsterisk placeholder="Enter login" rightSectionWidth="xl" />

            <Button loading={loading} size="md" type="submit" variant="gradient">Send temporary Password</Button>
            <div className="text-center ">Remember your password? <span className=" bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:underline cursor-pointer" onClick={() => navigate("/login")}>Login</span> </div>
        </form>
    </div>
}
export default ResetPassword;