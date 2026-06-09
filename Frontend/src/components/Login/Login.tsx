import { Button, PasswordInput, TextInput } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useForm } from '@mantine/form';
import { useState } from "react";
import { useAppDispatch } from "../../slices/hooks";
import { getUser, loginUser } from "../../services/LoginService";
import { setUser } from "../../slices/UserSlice";
import { IconLock, IconUser } from "@tabler/icons-react";

// LOT — Background Login : photo reelle de 2 mineurs africains avec overlay
// HSE digital cyan, mine au coucher de soleil. Source : imgs/Login/Login 1.png
import bgImg from "@/assets/login-mine-team.png";
import name from "@/assets/name.png";


const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false)
    const dispatch = useAppDispatch();
    const [error, setError] = useState(false);

    const form = useForm({
        initialValues: {
            login: '',
            password: '',

        },
        validate: {
            login: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return "Login is required";

                const wordCount = trimmed.length;
                return wordCount > 50 ? "Maximum 50 characters allowed" : null;
            },
            password: (value) => (!value ? "Password is required" : null),

        },
    });
    const handleSubmit = async (values: any) => {
        setError(false)
        form.validate();
        if (!form.isValid()) return;
        setLoading(true)
        try {
            await loginUser({ ...values });
            const res: any = await getUser();
            dispatch(setUser(res));
            navigate("/");
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    }


    return <div style={{ backgroundImage: `url(${bgImg})` }} className="flex flex-col gap-5 items-center bg-light-bg min-h-screen min-w-screen justify-center bg-cover bg-center">
        <div className="flex gap-2 text-2xl h-32 items-center text-neutral-50">
            <img className="object-contain !h-24  rounded-2xl  !w-auto" src={name} alt="" />
        </div>
        <form onSubmit={form.onSubmit(handleSubmit)} className="w-[28rem] flex flex-col gap-5 bg-white p-7 shadow-md rounded-xl">
            <div className="text-2xl self-center  bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Login</div>
            <TextInput size="md" {...form.getInputProps("login")} leftSection={<IconUser size={16} />} label="Login ID" withAsterisk placeholder="Your login id" />
            <PasswordInput size="md" {...form.getInputProps("password")} leftSection={<IconLock size={16} />} label="Password" withAsterisk placeholder="Your password" />
            {error && <div className="text-[#FA5252] text-center "> Incorrect Login ID or Password</div>}
            <Button type="submit" loading={loading} onClick={handleSubmit} size="md" variant="gradient">Login</Button>

            <div className=" bg-gradient-to-r self-center from-primary to-secondary bg-clip-text text-transparent hover:underline cursor-pointer" onClick={() => navigate("/forget-password")}>Forget password?</div>
        </form>
    </div>

}

export default Login