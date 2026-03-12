import { Card, Text, ThemeIcon, Badge } from '@mantine/core';
import type { MantineColor } from '@mantine/core';
import type { ReactNode } from 'react';


export type StatusSummaryCardConfig = {
    key: string;
    title: string;
    value: ReactNode;
    icon: any;
    color: MantineColor;
    description?: ReactNode;
    meta?: {
        label: ReactNode;
        color?: MantineColor;
        variant?: 'light' | 'outline' | 'filled' | 'dot';
    };
};

type StatusSummaryCardsProps = {
    cards: StatusSummaryCardConfig[];
    className?: string;
};

const gradientBackgroundFor = (color: MantineColor) =>
    `linear-gradient(135deg, var(--mantine-color-${color}-0, rgba(0, 0, 0, 0.04)) 0%, rgba(255, 255, 255, 0) 70%)`;

const accentColorFor = (color: MantineColor) =>
    `var(--mantine-color-${color}-5, rgba(0, 0, 0, 0.12))`;

const StatusSummaryCards = ({ cards, className }: StatusSummaryCardsProps) => {
    return (
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${className ?? ''}`}>
            {cards.map((card) => {
                const background = gradientBackgroundFor(card.color);
                const accent = accentColorFor(card.color);
                return (
                    <Card
                        key={card.key}
                        withBorder
                        radius="xl"
                        padding="lg"
                        className="relative overflow-hidden border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div
                            className="absolute inset-0 pointer-events-none opacity-80"
                            style={{ background }}
                        />
                        <div className="relative z-10 flex h-full flex-col ">
                            <div className="flex items-start justify-between">
                                <Text
                                    size="xs"
                                    fw={600}
                                    tt="uppercase"
                                    c="gray.6"
                                    className="tracking-wide"
                                >
                                    {card.title}
                                </Text>
                                <ThemeIcon
                                    variant="light"
                                    radius="lg"
                                    size="lg"
                                    color={card.color}
                                    className="shadow-inner transition-transform duration-200 ease-out hover:scale-105"
                                >
                                    <card.icon size={22} stroke={1.8} />
                                </ThemeIcon>
                            </div>
                            <Text size="xl" fw={700} c="gray.9">
                                {card.value}
                            </Text>
                            {/* {card.description && (
                                <Text size="xs" c="gray.6" className="leading-relaxed">
                                    {card.description}
                                </Text>
                            )} */}
                            {card.meta && (
                                <Badge
                                    color={card.meta.color ?? card.color}
                                    variant={card.meta.variant ?? 'light'}
                                    radius="sm"
                                    size="sm"
                                    className="w-fit"
                                >
                                    {card.meta.label}
                                </Badge>
                            )}
                        </div>
                        <div
                            className="absolute inset-x-6 bottom-0 h-0.5 rounded-full"
                            style={{ background: accent }}
                        />
                    </Card>
                );
            })}
        </div>
    );
};

export default StatusSummaryCards;
