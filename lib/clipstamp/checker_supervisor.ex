defmodule Clipstamp.CheckerSupervisor do
  use Supervisor

  def start_link() do
    Supervisor.start_link(__MODULE__, [], name: Clipstamp.CheckerSupervisor)
  end

  def init([]) do
    children = [
      worker(Clipstamp.VODChecker, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start_checker(slug) do
    Supervisor.start_child(Clipstamp.CheckerSupervisor, [[slug: slug]])
  end
end

