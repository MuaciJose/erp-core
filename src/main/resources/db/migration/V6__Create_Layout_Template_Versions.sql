CREATE TABLE IF NOT EXISTS layout_template_versions (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    tipo_layout VARCHAR(100) NOT NULL,
    version_number BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    html_content TEXT NULL,
    change_reason TEXT NULL,
    created_by VARCHAR(255) NULL,
    published_by VARCHAR(255) NULL,
    source_version_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_layout_template_versions_empresa_tipo
    ON layout_template_versions (empresa_id, tipo_layout, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_layout_template_versions_empresa_tipo_status
    ON layout_template_versions (empresa_id, tipo_layout, status);
