import os

from app import create_app

app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("VW_BACKEND_PORT", "5100"))
    app.run(host="0.0.0.0", port=port, debug=True)
