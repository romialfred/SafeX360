import { Button, PasswordInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconLock } from "@tabler/icons-react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { hideOverlay, showOverlay } from "../../slices/OverlaySlice";
import { successNotification } from "../../utility/NotificationUtility";

import bgImg from "@/assets/Picture2.png";

import name from "@/assets/name.png";
import { updatePassword } from "../../services/AccountService";

const FirstLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const form = useForm({
        initialValues: {
            confirmPassword: "",
            password: ""
        },
        validate: {
            password: (value) => !value ? "Password is required" : value.length < 12 ? "Password must be at least 12 characters long" : value.length > 18 ? "Password must be at most 18 characters long" : !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,18}$/.test(value) ? "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character" : null,
            confirmPassword: (value, values) => value !== values.password ? 'Passwords did not match' : null,
        },
    });
    useEffect(() => {
        const user = sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user") ?? "") : null;
        if (!user?.id) {
            navigate("/login");
        }
    }, [])
    const handleSubmit = () => {
        const user = JSON.parse(sessionStorage.getItem("user") ?? "");
        if (form.validate().hasErrors) return;
        dispatch(showOverlay());
        updatePassword({ id: user.id, password: form.getValues().password })
            .then((_res) => {
                sessionStorage.removeItem("user");
                successNotification("Password updated successfully. Please Login again");
                navigate("/login");


            })
            .finally(() => dispatch(hideOverlay()));

    }

    return <div style={{ backgroundImage: `url(${bgImg})` }} className="flex flex-col gap-5 items-center bg-light-bg min-h-screen justify-center bg-center bg-cover">
        <div className="flex gap-2 text-2xl h-32 items-center text-neutral-50">
            <img className="object-contain !h-24  rounded-2xl  !w-auto" src={name} alt="" />
        </div>
        <div className="w-[28rem] flex flex-col gap-5 bg-white p-7 shadow-md rounded-xl">
            <div className="text-2xl self-center  bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Reset Password</div>
            <PasswordInput size="md" {...form.getInputProps("password")} leftSection={<IconLock size={16} />} label="Password" withAsterisk placeholder="Enter Password" />
            <PasswordInput size="md" {...form.getInputProps("confirmPassword")} leftSection={<IconLock size={16} />} label="Confirm Password" withAsterisk placeholder="Enter Password Again" />

            <Button onClick={handleSubmit} size="md" variant="gradient">Reset Password</Button>
            <div className="text-center ">Done Already?  <span className=" bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:underline cursor-pointer" onClick={() => navigate("/login")}>Login</span> </div>
        </div>
    </div>
}

export default FirstLogin;