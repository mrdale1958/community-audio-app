"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react"; // Add this
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MicIcon from "@mui/icons-material/Mic";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, router]);

  if (!session) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  // Rest of your component...
  const contributorActions = [
    {
      title: "Live Recording",
      description: "Record audio directly in your browser",
      icon: <MicIcon sx={{ fontSize: 40 }} />,
      href: "/contribute/live",
      color: "primary.main",
    },
    {
      title: "Upload Recording",
      description: "Upload audio files you recorded offline",
      icon: <UploadFileIcon sx={{ fontSize: 40 }} />,
      href: "/contribute/offline",
      color: "secondary.main",
    },
    {
      title: "Listen to Recordings",
      description: "Play back community recordings",
      icon: <PlayArrowIcon sx={{ fontSize: 40 }} />,
      href: "/playback",
      color: "success.main",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome, {session.user.name}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Role: {session.user.role}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {contributorActions.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.title}>
            <Card
              sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Box sx={{ color: action.color, mb: 2 }}>{action.icon}</Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {action.description}
                </Typography>
                <Button
                  component={Link}
                  href={action.href}
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: action.color,
                    "&:hover": {
                      backgroundColor: action.color,
                      filter: "brightness(0.9)",
                    },
                  }}
                >
                  Start
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {(session?.user?.role === "ADMIN" ||
        session?.user?.role === "MANAGER") && (
        <Card>
          <CardContent>
            <Typography variant="h6">Admin Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage all recordings and exhibition queue
            </Typography>
            <Button
              component={Link}
              href="/admin"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Open Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
     
    </Container>
  );
}
