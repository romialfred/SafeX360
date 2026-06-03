import { Button, Text, TextInput } from "@mantine/core";
import { useNavigate } from "react-router-dom";

const ForgetPassword = () => {
    const navigate = useNavigate();

    return (
        <div className="flex">

            <div className=" bg-hoverbg p-5 flex flex-col w-[65%]">
                <Text size="xl" color="blue" fs="italic" tt="uppercase">Mine Xpert</Text>
                <div className="w-[585px] p-10 left-10 place-self-center">
                    <img src="/login-bg.svg" alt="" />
                </div>
            </div>
            <div className="p-10 self-center  w-[35%] flex flex-col gap-10" >
                <div className="flex flex-col gap-5">
                    <h1 className="text-2xl ">Forgot your password? </h1>
                    <p className="text-sm text-textprimary">Please enter the email address associated with your account and We will email you a link to reset your password.</p>
                </div>


                <div className="flex flex-col gap-10">
                    <TextInput label="Email" size="md" radius="md" withAsterisk className="!text-textprimary" />

                    <div className="flex flex-col gap-5">

                        <Button>Forget Password</Button>
                        <Button className="!bg-hoverbg !text-primary text-sm" onClick={() => navigate("/login")}>Back to Login</Button>
                    </div>

                </div>
            </div>

        </div>
    )
}

export default ForgetPassword