import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    text: {
      primary: "#FFFFFF",
    },
    background: {
      default: "#392742",
      paper: "#583866",
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
