import { Button, Center, Image, Stack } from '@mantine/core';
import image from '@/assets/img/image.svg';

const ModuleNotFoundPage = () => {
  const handleContactAdmin = () => {
    const subject = encodeURIComponent('Module Access Request');
    const body = encodeURIComponent(
      'Hello,\n\nI tried to access a disabled module. Please help enable access for my account or advise next steps.\n\nThank you,'
    );
    const mailtoLink = `mailto:subscription@mine-xpert.com?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };
  return (
    <Center mih="70vh">
      <Stack align="center" gap="md">
        <Image src={image} alt="404" maw={800} />
        <Button onClick={handleContactAdmin} variant="gradient">Contact Administrator</Button>
      </Stack>
    </Center>
  );
};

export default ModuleNotFoundPage;
