# Appwrite Migration

- Sept 1 2025 is the date we need to migrate our database from appwrite otherwise it will be deleted
- want to write logic for users to migrate to several other databases like
  - Postgres
  - MySql
  - MongoDB

## Our Job

- Create a node project that uses node-appwrite
  and we need to accordingly make our database
- appwrite have Auth Data, Database Data(Database,Collections,Attributes), Storage (we will store like cloudinary or aws s3) so we need to that accordingly
- no direct migration method is there for other db platform we need to write our own code.
