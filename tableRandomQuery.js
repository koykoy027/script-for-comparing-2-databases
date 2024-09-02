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
};

// Function to get all table names
const getTableNames = (connection, callback) => {
  connection.query("SHOW TABLES", (err, results) => {
    if (err) return callback(err);
    const tables = results.map((row) => Object.values(row)[0]);
    callback(null, tables);
  });
};

// Function to compare data between source and target databases using a random ID
const compareDataById = (sourceConn, targetConn, tables) => {
  // Select a random table
  const randomTable = tables[Math.floor(Math.random() * tables.length)];

  // Get a random ID from the source database
  const getRandomIdQuery = `SELECT id FROM \`${randomTable}\` ORDER BY RAND() LIMIT 1`;

  sourceConn.query(getRandomIdQuery, (err, sourceIdResults) => {
    if (err) {
      console.error(
        `Error getting random ID from source database table ${randomTable}:`,
        err
      );
      closeConnections(sourceConn, targetConn);
      return;
    }

    if (sourceIdResults.length === 0) {
      console.log(`No rows found in table ${randomTable}`);
      closeConnections(sourceConn, targetConn);
      return;
    }

    const randomId = sourceIdResults[0].id;

    // Query both source and target databases using the random ID
    const queryById = `SELECT * FROM \`${randomTable}\` WHERE id = ?`;

    sourceConn.query(queryById, [randomId], (err, sourceResults) => {
      if (err) {
        console.error(
          `Error querying source database table ${randomTable} with ID ${randomId}:`,
          err
        );
        closeConnections(sourceConn, targetConn);
        return;
      }

      targetConn.query(queryById, [randomId], (err, targetResults) => {
        if (err) {
          console.error(
            `Error querying target database table ${randomTable} with ID ${randomId}:`,
            err
          );
          closeConnections(sourceConn, targetConn);
          return;
        }

        // Compare the results
        console.log(
          `Query result from table ${randomTable} with ID ${randomId}:`
        );
        console.log("Source Results:", sourceResults);
        console.log("Target Results:", targetResults);

        const sourceData = JSON.stringify(sourceResults);
        const targetData = JSON.stringify(targetResults);

        if (sourceData === targetData) {
          console.log(
            `Data with ID ${randomId} in table ${randomTable} matches between source and target databases.`
          );
        } else {
          console.log(
            `Data with ID ${randomId} in table ${randomTable} differs between source and target databases.`
          );
        }

        // Close connections after comparison
        closeConnections(sourceConn, targetConn);
      });
    });
  });
};

// Function to close both connections
const closeConnections = (sourceConn, targetConn) => {
  sourceConn.end((err) => {
    if (err) {
      console.error("Error closing source database connection:", err);
    }
    console.log("Source database connection closed.");
  });

  targetConn.end((err) => {
    if (err) {
      console.error("Error closing target database connection:", err);
    }
    console.log("Target database connection closed.");
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
    console.log("Comparing please wait... ");

    // Get all table names from the source database
    getTableNames(sourceConnection, (err, tables) => {
      if (err) {
        console.error("Error fetching table names from source database:", err);
        closeConnections(sourceConnection, targetConnection);
        return;
      }

      // Execute and compare data by a random ID
      compareDataById(sourceConnection, targetConnection, tables);
    });
  });
});
