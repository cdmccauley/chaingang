import { grey } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

// A custom theme for this app
// const theme = createTheme({
//   palette: {
//     primary: {
//       main: "#556cd6",
//     },
//     secondary: {
//       main: "#19857b",
//     },
//     error: {
//       main: red.A400,
//     },
//   },
// });

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#47236b",
    },
  },
});

export default theme;

// https://mui.com/material-ui/customization/dark-mode/