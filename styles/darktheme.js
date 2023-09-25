import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    text: {
      primary: "#FFFFFF",
    },
    background: {
      default: "#121212",
      paper: "#242424",
    },
    primary: { main: "#FFFFFF" },
  },
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#FFF",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: "#FFF",
        },
      },
    },
  },
});

export default theme;
