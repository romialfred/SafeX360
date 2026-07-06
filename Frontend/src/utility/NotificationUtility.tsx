import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

const successNotification = (message: string) => {
  notifications.show({
    my: "lg",
    title: "Success",
    message: message,
    withCloseButton: true,
    icon: <IconCheck style={{ width: "90%", height: "90%" }} />,
    color: "teal",
    withBorder: true,
    className: "!border-green-500"
  })
}
const errorNotification = (message: string) => {
  notifications.show({
    my: "lg",
    title: "Error",
    message: message,
    withCloseButton: true,
    icon: <IconX style={{ width: "90%", height: "90%" }} />,
    color: "red",
    withBorder: true,
    className: "!border-red-500"
  })
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as any;
  return (
    err?.response?.data?.errorMessage ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export { successNotification, errorNotification, extractErrorMessage };