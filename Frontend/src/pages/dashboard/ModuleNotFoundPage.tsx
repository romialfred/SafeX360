import { Button, Center, Stack, Text, Title, Group } from '@mantine/core';
import { IconAlertCircle, IconHome, IconMail } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// LOT 40 P1: sober Module-Not-Found page — icon + title + description + back-to-home + contact admin
const ModuleNotFoundPage = () => {
  const navigate = useNavigate();

  const handleContactAdmin = () => {
    const subject = encodeURIComponent('Module Access Request');
    const body = encodeURIComponent(
      'Hello,\n\nI tried to access a disabled module. Please help enable access for my account or advise next steps.\n\nThank you,'
    );
    const mailtoLink = `mailto:subscription@mine-xpert.com?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <Center mih="70vh" px="md">
      <Stack align="center" gap="md" maw={480} ta="center">
        {/* LOT 40 P1: subtle warning icon (was a large 800px image) */}
        <IconAlertCircle size={64} stroke={1.4} color="#94a3b8" aria-hidden="true" />
        <Title order={2} c="dark.7" fw={600}>
          Module unavailable
        </Title>
        <Text c="dimmed" size="sm">
          This module is currently disabled for your account or your subscription
          plan does not include it. Contact your administrator to request access,
          or return to the home page.
        </Text>
        <Group mt="sm" gap="sm">
          <Button
            variant="default"
            leftSection={<IconHome size={16} />}
            onClick={() => navigate('/')}
          >
            Back to home
          </Button>
          <Button
            color="teal"
            leftSection={<IconMail size={16} />}
            onClick={handleContactAdmin}
          >
            Contact administrator
          </Button>
        </Group>
      </Stack>
    </Center>
  );
};

export default ModuleNotFoundPage;
