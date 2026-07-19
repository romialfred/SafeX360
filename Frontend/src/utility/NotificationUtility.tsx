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

/**
 * Extrait TOUJOURS une CHAÎNE affichable d'une erreur, quel que soit le format
 * renvoyé par le backend. Garantit qu'aucun objet ne finit rendu comme enfant
 * React (cause d'« Objects are not valid as a React child » → écran blanc).
 * Ordre : corps texte brut → errorMessage → message → error → err.message →
 * repli. Un corps objet inconnu ne fait JAMAIS échouer le rendu.
 */
function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as any;
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  const picked =
    data?.errorMessage ||
    data?.message ||
    data?.error ||
    err?.message;
  return typeof picked === "string" && picked.trim() ? picked.trim() : fallback;
}

export { successNotification, errorNotification, extractErrorMessage };