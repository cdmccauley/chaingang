import React, { useEffect, useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DataGrid } from "@mui/x-data-grid";

const rankColumns = [
  { field: "rank", headerName: "Rank", flex: 0.3 },
  { field: "name", headerName: "Name", flex: 0.3 },
  { field: "id", headerName: "ID", flex: 0.3 },
];

const pointColumns = [
  { field: "points", headerName: "Points", flex: 0.3 },
  { field: "name", headerName: "Name", flex: 0.3 },
  { field: "id", headerName: "ID", flex: 0.3 },
];

export default function Report({ props }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (props.report) {
      setOpen(true);
    }
  }, [props.report]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <Dialog fullWidth maxWidth open={open} onClose={handleClose}>
      <DialogContent>
        <Box sx={{ ml: 2, mr: 2, pt: 2 }}>
          {props?.report && props.report?.length > 0 && props.report[0]?.end ? (
            props?.report
              .sort((a, b) => b.end - a.end)
              .map((report) =>
                report?.ranks && report.ranks.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography>
                      {new Date(report.end).toLocaleString()}
                    </Typography>

                    <DataGrid
                      disableRowSelectionOnClick
                      density="comfortable"
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 10, page: 0 },
                        },
                      }}
                      pageSizeOptions={[10]}
                      rows={Array.from(report.ranks).sort((a, b) => a.rank - b.rank)}
                      columns={rankColumns}
                      sx={{ mt: 2, mb: 2 }}
                    />
                  </Box>
                ) : undefined
              )
          ) : (
            <DataGrid
              disableRowSelectionOnClick
              density="comfortable"
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pageSizeOptions={[10]}
              rows={Array.from(props.report).sort((a, b) => b.points - a.points)}
              columns={pointColumns}
              sx={{ mt: 2, mb: 2 }}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
