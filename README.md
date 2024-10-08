# Test your source and target database

## Introduction
If you plan to migrate your MySQL database, this script for comparison would be a big help to check if you migrated it 100%.

---

## Prerequisite
- Prepare your target and source database
- Your 2 databases should be in both MYSQL and have the same schema

## How to setup
- clone this repository
- Make sure you have `node` installed in your machine
- Go to directory and install dependencies `npm install`
- create your `.env` file to connect your database
```env
# Source Database Configuration
SOURCE_HOST='YOUR SOURCE_HOST'
SOURCE_USER='YOUR SOURCE_USER'
SOURCE_PASSWORD='YOUR SOURCE_PASSWORD'
SOURCE_DATABASE='YOUR SOURCE_DATABASE'
SOURCE_PORT='YOUR SOURCE_PORT'

# Target Database Configuration
TARGET_HOST='YOUR TARGET_HOST'
TARGET_USER='YOUR TARGET_USER'
TARGET_PASSWORD='YOUR TARGET_PASSWORD'
TARGET_DATABASE='YOUR TARGET_DATABASE'
```

## Available script

### Random Query 
If you want to run a random query across all tables in your database, you can achieve this by:
1. Retrieving the list of all tables in the database.
2. Selecting a random table from that list.
3. Selecting a random ID from selected random table.
4. Running a query on that randomly selected table and selected ID that will compare the source and target database.
5. optional, if you want a random query for specific table, open the `tableRandomQuery.js` file and locate const `randomTable` and change the value, same goes with ID just change the value of const `randomId`

Open your preferred terminal and run it using Node.js
```bash
node tableRandomQuery
```

### Table Row Counts
If you want to count query across all tables in your database, you can achieve this by:
1. Retrieving the list of all tables in the database.
2. Selecting all table from that list.
3. Running a query will count all rows.

Open your preferred terminal and run it using Node.js
```bash
node tableCounts
```

### Table Sizes
If you want to count query across all tables in your database, you can achieve this by:
1. Retrieves all column names from a table.
2. Calculates the average row size dynamically by selecting all columns and measuring their lengths.
3. Uses the average row size to estimate the total size of the table.

Open your preferred terminal and run it using Node.js
```bash
node tableSizes
```


## Potential error
```js
errorno: 'ETIMEDOUT',
code: 'ETIMEDOUT',
syscall: 'connect',
fatal: true
```
- 3306 is default port for mysql, if you're using different port make sure to indicate it.
