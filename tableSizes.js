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

// Function to get all column names for a table, escaping reserved keywords
const getColumnNames = (connection, tableName, callback) => {
  const query = `SHOW COLUMNS FROM ??`;
  connection.query(query, [tableName], (err, results) => {
    if (err) return callback(err);
    const columns = results.map(row => `\`${row.Field}\``); // Escape each column name
    callback(null, columns);
  });
};

// Function to get average row size by selecting all columns
const getAverageRowSize = (connection, tableName, callback) => {
  getColumnNames(connection, tableName, (err, columns) => {
    if (err) return callback(err);

    const selectQuery = `SELECT CONCAT_WS(',', ${columns.map(col => `COALESCE(CHAR_LENGTH(${col}), 0)`).join(', ')}) AS row_data FROM ??`;
    
    connection.query(selectQuery, [tableName], (err, results) => {
      if (err) return callback(err);
      
      const totalSize = results.reduce((sum, row) => sum + row.row_data.length, 0);
      const avgRowSize = totalSize / results.length || 100; // Default to 100 if no rows

      callback(null, avgRowSize);
    });
  });
};

// Function to get the estimated size of a table
const getTableSize = (connection, tableName, callback) => {
  const countQuery = `SELECT COUNT(*) AS rowCount FROM ??`;
  connection.query(countQuery, [tableName], (err, results) => {
    if (err) return callback(err);
    const rowCount = results[0].rowCount;

    getAverageRowSize(connection, tableName, (err, avgRowSize) => {
      if (err) return callback(err);

      const estimatedSize = rowCount * avgRowSize;
      callback(null, estimatedSize);
    });
  });
};

// Function to get all table names and their sizes
const getTableSizes = (connection, callback) => {
  const query = `SHOW TABLES`;
  connection.query(query, (err, results) => {
    if (err) return callback(err);
    const tables = results.map((row) => Object.values(row)[0]);

    let sizes = {};
    let pending = tables.length;

    tables.forEach((table) => {
      getTableSize(connection, table, (err, size) => {
        if (err) return callback(err);
        sizes[table] = size;
        pending--;
        if (pending === 0) callback(null, sizes);
      });
    });
  });
};

// Function to compare table sizes between source and target
const compareDatabases = (sourceConn, targetConn) => {
  getTableSizes(sourceConn, (err, sourceSizes) => {
    if (err) return console.error("Error fetching source table sizes:", err);

    getTableSizes(targetConn, (err, targetSizes) => {
      if (err) return console.error("Error fetching target table sizes:", err);

      console.log("Table size comparison results (in bytes):");
      const tables = new Set([...Object.keys(sourceSizes), ...Object.keys(targetSizes)]);
      const mismatchedTables = [];

      tables.forEach((table) => {
        const sourceSize = sourceSizes[table] || 0;
        const targetSize = targetSizes[table] || 0;

        console.log(`${table}`);
        console.log(`  Source Size: ${sourceSize}`);
        console.log(`  Target Size: ${targetSize}`);
        console.log();

        if (sourceSize !== targetSize) {
          mismatchedTables.push(table);
        }
      });

      if (mismatchedTables.length > 0) {
        console.log("Summary of Tables with Mismatched Sizes:");
        mismatchedTables.forEach((table) => {
          console.log(`- ${table}`);
        });
      } else {
        console.log("All tables have matching sizes.");
      }

      sourceConn.end();
      targetConn.end();
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
    console.log("Comparing, please wait...");

    compareDatabases(sourceConnection, targetConnection);
  });
});
