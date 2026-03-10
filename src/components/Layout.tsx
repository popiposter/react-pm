import React, { useState } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Title,
  NavLink,
  rem,
  useMantineTheme,
  Avatar,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendar, IconList, IconNetwork } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Проверка статуса сети
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Показываем ли navbar (скрыт на мобильных, если не активен burger)
  const showNavbar = !isMobile || (isMobile && opened);

  return (
    <AppShell
      header={{ height: isMobile ? 60 : 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={2}>Проектные табели</Title>
          </Group>
          <Group gap="md">
            <Center>
              <IconNetwork
                size={20}
                color={isOnline ? theme.colors.green[6] : theme.colors.yellow[6]}
                title={isOnline ? 'Онлайн' : 'Оффлайн'}
              />
            </Center>
            <Avatar size="md" color="blue" radius="xl">
              <span>П</span>
            </Avatar>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" hidden={!showNavbar}>
        <NavLink
          component={Link}
          to="/calendar"
          label="Календарь"
          leftSection={<IconCalendar style={{ width: rem(16), height: rem(16) }} />}
          active={location.pathname === '/calendar' || location.pathname === '/'}
        />
        <NavLink
          component={Link}
          to="/timesheets"
          label="Журнал табелей"
          leftSection={<IconList style={{ width: rem(16), height: rem(16) }} />}
          active={location.pathname === '/timesheets'}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>

      {isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: theme.colors.gray[0],
            borderTop: `1px solid ${theme.colors.gray[2]}`,
          }}
        >
          <Group justify="space-around" p="xs">
            <NavLink
              component={Link}
              to="/calendar"
              label="Календарь"
              leftSection={<IconCalendar style={{ width: rem(16), height: rem(16) }} />}
              active={location.pathname === '/calendar' || location.pathname === '/'}
            />
            <NavLink
              component={Link}
              to="/timesheets"
              label="Табели"
              leftSection={<IconList style={{ width: rem(16), height: rem(16) }} />}
              active={location.pathname === '/timesheets'}
            />
          </Group>
        </div>
      )}
    </AppShell>
  );
}
