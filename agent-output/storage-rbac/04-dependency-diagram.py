"""Step 4 deployment dependency diagram for storage-rbac."""

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
    "label": "Step 4 Deployment Dependencies | storage-rbac",
}

cluster_attr = {"style": "rounded", "fontsize": "12"}

with Diagram(
    "storage-rbac-dependencies",
    filename="agent-output/storage-rbac/04-dependency-diagram",
    show=False,
    direction="LR",
    outformat="png",
    graph_attr=graph_attr,
):
    with Cluster("rg-storage-rbac-dev", graph_attr=cluster_attr):
        storage = StorageAccounts("Storage Account\nStandard_LRS")

    user = ActiveDirectory("jack.stalley\n(Blob Data Contributor)")

    e_rbac = Edge(color="#1565C0", style="bold", label="RBAC Assignment")

    user >> e_rbac >> storage
