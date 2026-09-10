-- Adicionar coluna rua em demo_lote15_vistorias se não existir
ALTER TABLE demo_lote15_vistorias
  ADD COLUMN IF NOT EXISTS rua text;
