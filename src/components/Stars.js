import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

const simbadSearchUrl = "https://simbad.u-strasbg.fr/simbad/sim-basic?Ident=";
const googleImageUrl = "https://www.google.com/search?tbm=isch&q=";

function createData(name, temp) {
  return {
    name,
    temp,
    simbad: `${simbadSearchUrl + name.replace(/ /g, "+")}`,
    googleImage: `${googleImageUrl + name.replace(/ /g, "+")}+star`,
  };
}

const rows = [
  createData("The Sun", 5700),
  createData("Sirius A", 9940),
  createData("Procyon A", 6580),
  createData("Alpha Centauri A", 5790),
  createData("Vega", 9600),
  createData("Altair", 7600),
  createData("Betelgeuse", 3600),
  createData("Rigel", 12100),
  createData("Pollux", 4800),
  createData("Capella A", 4900),
  createData("Deneb", 8525),
  createData("WISE 0855−0714", 240),
  createData("WISE 0350-5658", 1600),
];

export default function Stars() {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Star name</TableCell>
            <TableCell>Temperature (Kelvin)</TableCell>
            <TableCell>SIMBAD link</TableCell>
            <TableCell>Google images link</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.name}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell>{row.temp}</TableCell>
              <TableCell>
                <a href={row.simbad} target="_blank" rel="noreferrer">
                  SIMBAD
                </a>
              </TableCell>
              <TableCell>
                <a href={row.googleImage} target="_blank" rel="noreferrer">
                  Google images
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
