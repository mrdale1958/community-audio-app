"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AudioFile } from "@mui/icons-material";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            Read My Name
          </Link>
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          {status === "loading" ? (
            <Typography variant="body2">Loading...</Typography>
          ) : session ? (
            <>
              <Button color="inherit" component={Link} href="/dashboard">
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={Link}
                href="/dashboard/recordings"
                startIcon={<AudioFile />}
              >
                Recordings
              </Button>
              {(session.user.role === "ADMIN" ||
                session.user.role === "MANAGER") && (
                <Button color="inherit" component={Link} href="/admin">
                  Admin
                </Button>
              )}
              <Button color="inherit" onClick={handleSignOut}>
                Sign Out ({session.user.name})
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} href="/auth/signin">
                Sign In
              </Button>
              <Button color="inherit" component={Link} href="/auth/signup">
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
