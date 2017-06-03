defmodule Clipstamp.ClipChannel do
  use Phoenix.Channel

  def join("slug:" <> slug, _message, socket) do
    case Registry.lookup(Clipstamp.VODCheckerRegistry, slug) do
      [] ->
        {:ok, pid} = Clipstamp.CheckerSupervisor.start_checker(slug)
      _ ->
        :ok
    end
    {:ok, socket}
  end
end
