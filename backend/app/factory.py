from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .config import Settings
from .routes import api
from .services.session_manager import SessionManager


def create_app() -> Flask:
    app = Flask(__name__)
    settings = Settings()
    app.config["SETTINGS"] = settings
    
    # Handle multiple origins for CORS
    origins = [origin.strip() for origin in settings.frontend_origin.split(",")]
    CORS(app, resources={r"/api/*": {"origins": origins}})

    session_manager = SessionManager(settings=settings)
    session_manager.start_cleanup_loop()
    app.extensions["session_manager"] = session_manager
    app.register_blueprint(api, url_prefix="/api")

    @app.errorhandler(ValueError)
    def _handle_value_error(error: ValueError):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(FileNotFoundError)
    def _handle_missing(error: FileNotFoundError):
        return jsonify({"error": str(error)}), 404

    @app.errorhandler(HTTPException)
    def _handle_http(error: HTTPException):
        return jsonify({"error": error.description}), error.code

    @app.errorhandler(RuntimeError)
    def _handle_runtime(error: RuntimeError):
        return jsonify({"error": str(error)}), 500

    @app.teardown_appcontext
    def _teardown(_: object) -> None:
        return None

    return app
