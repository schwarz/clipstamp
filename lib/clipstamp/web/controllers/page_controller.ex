defmodule Clipstamp.Web.PageController do
  use Clipstamp.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
