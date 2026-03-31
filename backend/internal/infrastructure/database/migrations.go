package database

// GetMigrations returns all available migrations
func GetMigrations() []*Migration {
	return []*Migration{
		{
			Version: 1,
			Name:    "create_users_table",
			Up: `
				CREATE TABLE users (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					email VARCHAR(255) UNIQUE NOT NULL,
					name VARCHAR(255) NOT NULL,
					password_hash VARCHAR(255) NOT NULL,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				);
				
				CREATE INDEX idx_users_email ON users(email);
			`,
			Down: `
				DROP INDEX IF EXISTS idx_users_email;
				DROP TABLE IF EXISTS users;
			`,
		},
		{
			Version: 2,
			Name:    "create_books_table",
			Up: `
				CREATE TABLE books (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
					title VARCHAR(500) NOT NULL,
					author VARCHAR(255) NOT NULL,
					isbn VARCHAR(20),
					status VARCHAR(20) NOT NULL CHECK (status IN ('UNREAD', 'READING', 'FINISHED')),
					image_url TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				);
				
				CREATE INDEX idx_books_user_id ON books(user_id);
				CREATE INDEX idx_books_status ON books(status);
				CREATE INDEX idx_books_user_status ON books(user_id, status);
			`,
			Down: `
				DROP INDEX IF EXISTS idx_books_user_status;
				DROP INDEX IF EXISTS idx_books_status;
				DROP INDEX IF EXISTS idx_books_user_id;
				DROP TABLE IF EXISTS books;
			`,
		},
	}
}
