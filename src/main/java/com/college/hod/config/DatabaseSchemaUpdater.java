package com.college.hod.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaUpdater {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaUpdater.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaUpdater(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void updateDatabaseSchema() {
        try {
            // Detect database type
            String databaseProductName = jdbcTemplate.getDataSource().getConnection().getMetaData().getDatabaseProductName().toLowerCase();
            log.info("Database type detected: {}", databaseProductName);

            // Update certificate status column based on database type
            if (databaseProductName.contains("mysql")) {
                jdbcTemplate.execute("ALTER TABLE certificate MODIFY COLUMN status VARCHAR(32)");
            } else if (databaseProductName.contains("h2")) {
                jdbcTemplate.execute("ALTER TABLE certificate ALTER COLUMN status VARCHAR(32)");
            }
            log.info("Ensured certificate.status can store all certificate states.");
        } catch (Exception ex) {
            log.warn("Could not update certificate.status column automatically: {}", ex.getMessage());
        }

        try {
            // Check if rejection_remark column exists
            Integer columnCount;
            String databaseProductName = jdbcTemplate.getDataSource().getConnection().getMetaData().getDatabaseProductName().toLowerCase();

            if (databaseProductName.contains("mysql")) {
                columnCount = jdbcTemplate.queryForObject(
                        """
                        SELECT COUNT(*)
                        FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'request'
                          AND COLUMN_NAME = 'rejection_remark'
                        """,
                        Integer.class
                );
            } else if (databaseProductName.contains("h2")) {
                columnCount = jdbcTemplate.queryForObject(
                        """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_name = 'REQUEST'
                          AND column_name = 'REJECTION_REMARK'
                        """,
                        Integer.class
                );
            } else {
                columnCount = 0; // Skip for unknown databases
            }

            if (columnCount == null || columnCount == 0) {
                if (databaseProductName.contains("mysql")) {
                    jdbcTemplate.execute("ALTER TABLE request ADD COLUMN rejection_remark TEXT");
                } else if (databaseProductName.contains("h2")) {
                    jdbcTemplate.execute("ALTER TABLE request ADD COLUMN rejection_remark CLOB");
                }
                log.info("Ensured request.rejection_remark exists for HOD remarks.");
            }
        } catch (Exception ex) {
            log.warn("Could not update request.rejection_remark column automatically: {}", ex.getMessage());
        }
    }
}
