# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# Configures the endpoint
config :clipstamp, Clipstamp.Web.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "zT3jwUeCzmDE6O9yjtkkFUiqRXGQBJXkAkGQKdXzlGZSzVVHfj4EFFh/Fsg0g2Hu",
  render_errors: [view: Clipstamp.Web.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Clipstamp.PubSub,
           adapter: Phoenix.PubSub.PG2]
config :clipstamp,
  twitch_client_id: System.get_env("TWITCH_CLIENT_ID")

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
