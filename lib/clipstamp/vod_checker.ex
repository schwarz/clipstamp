defmodule Clipstamp.VODChecker do
  use GenStateMachine
  require Logger

  defmodule Data do
    defstruct [:slug, :backoff]
  end

  defmodule APIResponse do
    defstruct [:vod]
  end

  defmodule VOD do
    defstruct [:id, :url]
  end

  # Client

  def start_link(opts) when is_list(opts) do
    slug = Keyword.fetch!(opts, :slug)
    GenStateMachine.start_link(__MODULE__, opts, name: via_tuple(slug))
  end

  def init(args) do
    Logger.debug("Starting")
    slug = Keyword.fetch!(args, :slug)
    Process.send(self(), :fetch, [])
    {:ok, :fresh, %Data{slug: slug, backoff: 1}}
  end

  defp via_tuple(name) do
    {:via, Registry, {Clipstamp.VODCheckerRegistry, name}}
  end

  defp endpoint() do
    "https://api.twitch.tv/kraken/clips/"
  end

  def fetch(slug) do
    Logger.debug("fetch/1")
    with {:ok, client_id} <- Application.fetch_env(:clipstamp, :twitch_client_id),
         {:ok, %HTTPoison.Response{body: resp, status_code: 200}} <- HTTPoison.get(endpoint() <> slug, [{"Accept", "application/vnd.twitchtv.v5+json"}, {"Client-ID", client_id}]),
         {:ok, %APIResponse{vod: %VOD{url: url}}} <- Poison.decode(resp, as: %APIResponse{vod: %VOD{}}) do
      {:ok, url}
    else
      {:ok, %Clipstamp.VODChecker.APIResponse{vod: nil}} ->
        {:error, :no_vod}
      {:ok, %HTTPoison.Response{status_code: 400}} ->
        {:error, 400}
      {:ok, %HTTPoison.Response{status_code: 404}} ->
        {:error, :not_found}
      reason ->
        {:error, reason}
    end
  end

  def get_state(pid) do
    GenStateMachine.call(pid, :get_state)
  end

  # Server (callbacks)

  def handle_event(:cast, :flip, :off, data) do
    {:next_state, :on, data + 1}
  end

  def handle_event({:call, from}, :get_state, state, _data) do
    {:keep_state_and_data, [{:reply, from, state}]}
  end

  def handle_event(:info, :fetch, _state, %Data{slug: slug, backoff: 15}) do
      Clipstamp.Web.Endpoint.broadcast("slug:" <> slug, "not_found", %{})
      :stop
  end

  def handle_event(:info, :fetch, state, data) when state in [:fresh, :trying] do
    %Data{slug: slug, backoff: backoff} = data
    Clipstamp.Web.Endpoint.broadcast("slug:" <> slug, "keepalive", %{backoff: backoff})
    Logger.debug("Updating")
    with {:ok, url} <- fetch(slug) do
      Clipstamp.Web.Endpoint.broadcast("slug:" <> slug, "found", %{url: url})
      Logger.debug("VOD found for slug #{slug}")
      # All good, no longer needed
      :stop
    else
      {:error, :not_found} ->
        Clipstamp.Web.Endpoint.broadcast("slug:" <> slug, "not_found", %{})
        Logger.debug("VOD not found for slug #{slug}")
        :stop
      reason ->
        IO.inspect reason
        Process.send_after(self(), :fetch, 30_000 * backoff)
        {:next_state, :trying, %Data{data | backoff: backoff + 1}}
    end
  end

  def handle_event(event_type, event_content, state, data) do
    # Call the default implementation from GenStateMachine
    super(event_type, event_content, state, data)
  end
end
