# Without init file
# Python treats the models folder as just a collection of separate, disconnected files.
# from app.models.user import User
# from app.models.conversation import Conversation
# from app.models.chat_message import ChatMessage

# With init file (Clean, organized, and easy to read)
# Turn the models folder into a unified Python package
# from app.models import User, Conversation, ChatMessage

# Crucial for Alembic migrations: when Alembic loads Base.metadata, 
# it needs all models to be loaded in Python memory so it can detect changes and auto-generate SQL migration scripts.

from app.db.session import Base
from app.models.user import User
from app.models.conversation import Conversation
from app.models.chat_message import ChatMessage
from app.models.document import Document, DocumentChunk
from app.models.analytics import AnalyticsEvent

# Now all models are registered with Base
# __all__ defines exactly what gets exported when another file uses a "wildcard" import like this: import *
__all__ = ['Base', 'User', 'Conversation', 'ChatMessage', 'Document', 'DocumentChunk', 'AnalyticsEvent']