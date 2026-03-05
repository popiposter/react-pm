import React from 'react';
import { AppShell, Burger, Group, Title, NavLink, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendar, IconList } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={2}>Проектные табели</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
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
          label="Мои табели"
          leftSection={<IconList style={{ width: rem(16), height: rem(16) }} />}
          active={location.pathname === '/timesheets'}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}