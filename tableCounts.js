const mysql = require("mysql2");
require("dotenv").config();

// Configuration for source and target databases
const sourceConfig = {
  host: process.env.SOURCE_HOST,
  user: process.env.SOURCE_USER,
  password: process.env.SOURCE_PASSWORD,
  database: process.env.SOURCE_DATABASE,
  port: process.env.SOURCE_PORT,
};

const targetConfig = {
  host: process.env.TARGET_HOST,
  user: process.env.TARGET_USER,
  password: process.env.TARGET_PASSWORD,
  database: process.env.TARGET_DATABASE,
  port: process.env.TARGET_PORT,
};

// Function to get table names
const getTableNames = (connection, callback) => {
  connection.query("SHOW TABLES", (err, results) => {
    if (err) return callback(err);
    const tables = results.map((row) => Object.values(row)[0]);
    callback(null, tables);
  });
};

// Function to get row count for a table
const getRowCount = (connection, tableName, callback) => {
  const query = `SELECT COUNT(*) AS count FROM ??`;
  connection.query(query, [tableName], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count);
  });
};

// Function to get row counts for all tables
const getTableRowCounts = (connection, tables, callback) => {
  const rowCounts = {};
  let pending = tables.length;

  tables.forEach((table) => {
    getRowCount(connection, table, (err, count) => {
      if (err) return callback(err);
      rowCounts[table] = count;
      pending--;
      if (pending === 0) callback(null, rowCounts);
    });
  });
};

// Function to compare row counts between source and target
const compareDatabases = (sourceConn, targetConn) => {
  getTableNames(sourceConn, (err, sourceTables) => {
    if (err) return console.error("Error fetching source tables:", err);

    getTableNames(targetConn, (err, targetTables) => {
      if (err) return console.error("Error fetching target tables:", err);

      const tables = new Set([...sourceTables, ...targetTables]);

      getTableRowCounts(sourceConn, Array.from(tables), (err, sourceCounts) => {
        if (err) return console.error("Error fetching source row counts:", err);

        getTableRowCounts(
          targetConn,
          Array.from(tables),
          (err, targetCounts) => {
            if (err)
              return console.error("Error fetching target row counts:", err);

            console.log("Table comparison results:");
            const mismatchedTables = [];

            tables.forEach((table) => {
              const sourceCount = sourceCounts[table] || 0;
              const targetCount = targetCounts[table] || 0;

              console.log(`${table}`);
              console.log(`   Source rows = ${sourceCount}`);
              console.log(`   Target rows = ${targetCount}`);
              console.log();

              if (sourceCount !== targetCount) {
                mismatchedTables.push(table);
              }
            });

            if (mismatchedTables.length > 0) {
              console.log("Summary of Tables with Mismatched Row Counts:");
              mismatchedTables.forEach((table) => {
                console.log(`- ${table}`);
              });
            } else {
              console.log("All tables have matching row counts.");
            }

            sourceConn.end();
            targetConn.end();
          }
        );
      });
    });
  });
};

// Create connections to source and target databases
const sourceConnection = mysql.createConnection(sourceConfig);
const targetConnection = mysql.createConnection(targetConfig);

// Connect to both databases and start comparison
sourceConnection.connect((err) => {
  if (err) {
    console.error("Error connecting to source database:", err);
    return;
  }
  console.log("Connected to source database.");

  targetConnection.connect((err) => {
    if (err) {
      console.error("Error connecting to target database:", err);
      return;
    }
    console.log("Connected to target database.");
    console.log("Comparing, please wait... ");
    compareDatabases(sourceConnection, targetConnection);
  });
});
