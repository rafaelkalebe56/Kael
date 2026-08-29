from kael.bot import KaelBot
from kael.config import Settings


def main() -> None:
    settings = Settings.from_environment()
    KaelBot(settings).run(settings.discord_token, log_handler=None)


if __name__ == "__main__":
    main()

