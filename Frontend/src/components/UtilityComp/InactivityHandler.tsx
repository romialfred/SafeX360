import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Group, Modal, Progress, Stack, Text, Title } from '@mantine/core';
import { useAppSelector } from '../../slices/hooks';
import useLogout from '../../hooks/useLogout';
import { Z } from '../../constants/zIndex';

const ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
    'mousemove',
    'mousedown',
    'keypress',
    'scroll',
    'touchstart'
];

const WARNING_DURATION_SECONDS = 60;
const DEFAULT_INACTIVITY_MINUTES = 15;

const InactivityHandler = ({ inactivityMinutes = DEFAULT_INACTIVITY_MINUTES }: { inactivityMinutes?: number }) => {
    const user = useAppSelector((state) => state.user);
    const isLoggedIn = useMemo(() => Boolean(user && Object.keys(user).length > 0), [user]);
    const logout = useLogout();
    const logoutRef = useRef(logout);

    useEffect(() => {
        logoutRef.current = logout;
    }, [logout]);

    const inactivityTimeoutRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [countdown, setCountdown] = useState(WARNING_DURATION_SECONDS);

    const clearInactivityTimeout = useCallback(() => {
        if (inactivityTimeoutRef.current) {
            window.clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }
    }, []);

    const clearCountdownInterval = useCallback(() => {
        if (countdownIntervalRef.current) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const scheduleInactivityTimeout = useCallback(() => {
        clearInactivityTimeout();
        if (!isLoggedIn) {
            return;
        }
        inactivityTimeoutRef.current = window.setTimeout(() => {
            setIsModalOpen(true);
        }, inactivityMinutes * 60 * 1000);
    }, [clearInactivityTimeout, inactivityMinutes, isLoggedIn]);

    const handleActivity = useCallback(() => {
        if (!isLoggedIn || isModalOpen) {
            return;
        }
        scheduleInactivityTimeout();
    }, [isLoggedIn, isModalOpen, scheduleInactivityTimeout]);

    const handleStayLoggedIn = useCallback(() => {
        setIsModalOpen(false);
        scheduleInactivityTimeout();
    }, [scheduleInactivityTimeout]);

    const handleLogoutNow = useCallback(() => {
        setIsModalOpen(false);
        logout();
    }, [logout]);

    useEffect(() => {
        if (isLoggedIn) {
            scheduleInactivityTimeout();
        } else {
            setIsModalOpen(false);
            clearInactivityTimeout();
            clearCountdownInterval();
            setCountdown(WARNING_DURATION_SECONDS);
        }
    }, [isLoggedIn, scheduleInactivityTimeout, clearInactivityTimeout, clearCountdownInterval]);

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        ACTIVITY_EVENTS.forEach((eventName) => {
            document.addEventListener(eventName, handleActivity);
        });

        return () => {
            ACTIVITY_EVENTS.forEach((eventName) => {
                document.removeEventListener(eventName, handleActivity);
            });
        };
    }, [handleActivity, isLoggedIn]);

    useEffect(() => {
        if (!isModalOpen) {
            clearCountdownInterval();
            setCountdown(WARNING_DURATION_SECONDS);
            return;
        }

        clearCountdownInterval();
        setCountdown(WARNING_DURATION_SECONDS);

        countdownIntervalRef.current = window.setInterval(() => {
            setCountdown((prev) => {
                const nextValue = prev - 1;
                if (nextValue <= 0) {
                    clearCountdownInterval();
                    setIsModalOpen(false);
                    logoutRef.current();
                    return 0;
                }
                return nextValue;
            });
        }, 1000);

        return () => {
            clearCountdownInterval();
        };
    }, [isModalOpen, clearCountdownInterval]);

    useEffect(() => {
        return () => {
            clearInactivityTimeout();
            clearCountdownInterval();
        };
    }, [clearCountdownInterval, clearInactivityTimeout]);

    if (!isLoggedIn) {
        return null;
    }

    return (
        <Modal
            opened={isModalOpen}
            onClose={handleStayLoggedIn}
            closeOnClickOutside={false}
            closeOnEscape={false}
            withCloseButton={false}
            centered
            overlayProps={{ blur: 6, backgroundOpacity: 0.65 }}
            radius="lg"
            zIndex={Z.critical}
        >
            <Stack gap="md" align="center">
                <Title order={3}>Still there?</Title>
                <Text ta="center" size="sm" c="dimmed">
                    For your security, you will be logged out soon due to inactivity.
                </Text>
                <Stack gap={4} w="100%">
                    <Group justify="space-between">
                        <Text size="sm">Auto logout in</Text>
                        <Text size="sm" c="red">{countdown}s</Text>
                    </Group>
                    <Progress value={Math.max(0, (countdown / WARNING_DURATION_SECONDS) * 100)} color="red" radius="xl" size="lg" animated={false} />
                </Stack>
                <Text size="sm" ta="center">
                    Click <Text span>Stay Logged In</Text> to keep working.
                </Text>
                <Group w="100%">
                    <Button variant="light" color="gray" fullWidth onClick={handleLogoutNow}>
                        Logout now
                    </Button>
                    <Button variant="filled" color="red" fullWidth onClick={handleStayLoggedIn}>
                        Stay logged in
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default InactivityHandler;
