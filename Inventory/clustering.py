import requests
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

API_URL = "http://119.59.102.161:3055/api/products"


def load_products():
    """ดึงข้อมูลสินค้าจาก API"""

    username = input("Username: ").strip()
    role = input("Role (admin/user): ").strip()

    headers = {
        "x-username": username,
        "x-role": role
    }

    response = requests.get(
        API_URL,
        headers=headers,
        timeout=10
    )

    response.raise_for_status()

    return response.json()


def main():

    print("=" * 60)
    print("K-Means Clustering - Motorcycle Fairings")
    print("=" * 60)

    # ดึงข้อมูลสินค้าจาก API
    try:
        products = load_products()
    except requests.RequestException as e:
        print("ไม่สามารถเชื่อมต่อ API ได้:", e)
        return

    if not products:
        print("ไม่พบข้อมูลสินค้า")
        return

    # แปลงข้อมูลเป็น DataFrame
    df = pd.DataFrame(products)

    # ตรวจสอบ column
    required_columns = [
        "id",
        "name",
        "model",
        "price",
        "stock"
    ]

    missing = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing:
        print("ข้อมูลขาด column:", missing)
        return

    # แปลง price และ stock เป็นตัวเลข
    df["price"] = pd.to_numeric(
        df["price"],
        errors="coerce"
    )

    df["stock"] = pd.to_numeric(
        df["stock"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["price", "stock"]
    ).copy()

    if len(df) < 2:
        print("ต้องมีสินค้าอย่างน้อย 2 รายการ")
        return

    # ใช้ price และ stock เป็นข้อมูลสำหรับ K-Means
    features = df[["price", "stock"]]

    # Standardization
    scaler = StandardScaler()

    X = scaler.fit_transform(features)

    # ==================================================
    # Elbow Method
    # ==================================================

    max_k = min(6, len(df))

    k_values = range(1, max_k + 1)

    inertias = []

    for k in k_values:

        model = KMeans(
            n_clusters=k,
            random_state=42,
            n_init=10
        )

        model.fit(X)

        inertias.append(
            model.inertia_
        )

    plt.figure(figsize=(8, 5))

    plt.plot(
        list(k_values),
        inertias,
        marker="o"
    )

    plt.xlabel("Number of clusters (k)")
    plt.ylabel("Inertia")
    plt.title("Elbow Method")

    plt.xticks(
        list(k_values)
    )

    plt.grid(True)

    plt.tight_layout()

    plt.savefig(
        "elbow_method.png",
        dpi=150
    )

    plt.show()

    # ==================================================
    # K-Means
    # ==================================================

    # กำหนดจำนวนกลุ่ม
    k = min(3, len(df))

    kmeans = KMeans(
        n_clusters=k,
        random_state=42,
        n_init=10
    )

    df["cluster"] = kmeans.fit_predict(X)

    # เรียง Cluster ตามราคาเฉลี่ย
    cluster_price = (
        df.groupby("cluster")["price"]
        .mean()
        .sort_values()
    )

    cluster_order = {
        old: new
        for new, old
        in enumerate(cluster_price.index)
    }

    df["cluster"] = df["cluster"].map(
        cluster_order
    )

    # ชื่อกลุ่ม
    labels = {
        0: "ราคาต่ำ",
        1: "ราคาปานกลาง",
        2: "ราคาสูง"
    }

    df["group"] = df["cluster"].map(
        labels
    )

    # ==================================================
    # แสดงผล
    # ==================================================

    result = df[
        [
            "id",
            "name",
            "model",
            "price",
            "stock",
            "cluster",
            "group"
        ]
    ].sort_values("cluster")

    print()
    print("ผลการจัดกลุ่มสินค้า")
    print("-" * 60)

    print(
        result.to_string(
            index=False
        )
    )

    # ==================================================
    # สรุป Cluster
    # ==================================================

    print()
    print("สรุปแต่ละกลุ่ม")
    print("-" * 60)

    summary = (
        df.groupby(
            ["cluster", "group"]
        )
        .agg(
            จำนวนสินค้า=("id", "count"),
            ราคาเฉลี่ย=("price", "mean"),
            Stockเฉลี่ย=("stock", "mean")
        )
        .reset_index()
    )

    print(
        summary.to_string(
            index=False
        )
    )

    # ==================================================
    # กราฟ K-Means
    # ==================================================

    plt.figure(figsize=(8, 5))

    for cluster in sorted(
        df["cluster"].unique()
    ):

        group = df[
            df["cluster"] == cluster
        ]

        plt.scatter(
            group["price"],
            group["stock"],
            label=labels.get(
                cluster,
                f"Cluster {cluster}"
            )
        )

        for _, row in group.iterrows():

            plt.annotate(
                str(row["name"]),
                (
                    row["price"],
                    row["stock"]
                ),
                xytext=(5, 5),
                textcoords="offset points",
                fontsize=8
            )

    plt.xlabel("Price (บาท)")
    plt.ylabel("Stock")
    plt.title(
        "K-Means Product Clustering"
    )

    plt.legend()
    plt.grid(True)

    plt.tight_layout()

    plt.savefig(
        "kmeans_clusters.png",
        dpi=150
    )

    plt.show()

    # ==================================================
    # บันทึกผลลัพธ์
    # ==================================================

    result.to_csv(
        "cluster_results.csv",
        index=False,
        encoding="utf-8-sig"
    )

    print()
    print("สร้างไฟล์ผลลัพธ์แล้ว:")
    print("1. elbow_method.png")
    print("2. kmeans_clusters.png")
    print("3. cluster_results.csv")


if __name__ == "__main__":
    main()