"""Step 4 runtime flow diagram for storage-rbac."""

from diagrams import Cluster, Diagram, Edge
from diagrams.azure.identity import ActiveDirectory
from diagrams.azure.storage import StorageAccounts

graph_attr = {
    "bgcolor": "white",
    "pad": "0.6",
    "nodesep": "1.0",
    "ranksep": "1.2",
    "splines": "polyline",
    "fontsize": "14",
    "labelloc": "t",
    "label": "Step 4 Runtime Flow | storage-rbac",
}

cluster_attr = {"style": "rounded", "fontsize": "12"}

with Diagram(
    "storage-rbac-runtime",
    filename="agent-output/storage-rbac/04-runtime-diagram",
    show=False,
    direction="LR",
    outformat="png",
    graph_attr=graph_attr,
):
    entra = ActiveDirectory("Entra ID\nAuthentication")

    with Cluster("rg-storage-rbac-dev", graph_attr=cluster_attr):
        storage = StorageAccounts("Storage Account\nBlob Service\nHTTPS / TLS 1.2")

    e_auth = Edge(color="#1565C0", style="bold", label="Entra ID Token")
    e_data = Edge(color="#2E7D32", style="bold", label="Blob Data\n(HTTPS)")

    entra >> e_auth >> storage
