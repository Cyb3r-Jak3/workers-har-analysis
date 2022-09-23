import { D1Orm, DataTypes, Model } from 'd1-orm'

type SessionInfo = {
    id: string
    name: string
    email: string
}

// We must initialise an ORM to use the Model class. This is done by passing in a D1Database instance (in this case it's bound to the `env.DB` environment variable).

export async function DBStart(D1: D1Database) {
    const orm = new D1Orm(D1)

    // Now, to create the model:
    const sessions = new Model<SessionInfo>(
        {
            D1Orm: orm,
            tableName: 'sessions',
        },
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                notNull: true,
            },
            token: {
                type: DataTypes.STRING,
                notNull: true,
            },
            hash: {
                type: DataTypes.STRING,
                notNull: true,
            },
            filename: {
                type: DataTypes.STRING,
                notNull: true,
                unique: true,
            },
        }
    )
    try {
        await sessions.CreateTable()
    } catch (error) {
        console.log(error)
    }
}
