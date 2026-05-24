# Pitfalls

## Do Not Repeat
- Do not let the live adapter become a second experiment-foundation implementation.
- Do not let experiment-foundation callbacks directly create trusted `RunEvidenceUnit`.
- Do not treat external job success as a scientific outcome; scientific outcome still comes from `RunEvidenceUnit.run_status` and result validation.
- Do not copy training task specs, recipes, datasets, code, result artifacts, or validation reports into PaperImplementation payloads beyond refs/hashes.
- Do not make cloud credentials or external provider availability required for default verification.
