document.addEventListener("DOMContentLoaded", () => {
    // Mengambil referensi elemen-elemen HTML yang dibutuhkan
    const productForm = document.getElementById("productForm");
    const editProductForm = document.getElementById("editProductForm");
    const productTable = document.getElementById("productTableBody");

    // Fungsi untuk mengambil data produk dari server dan menampilkannya dalam tabel
    function fetchProducts() {
        fetch("http://127.0.0.1:5000/product")
            .then(response => response.json())
            .then(data => {
                productTable.innerHTML = ""; // Kosongkan tabel sebelum mengisi ulang data
                data.payload.forEach(product => {
                    // Tambahkan setiap produk ke dalam tabel
                    productTable.innerHTML += `
    <tr>
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>Rp ${product.price.toLocaleString('id-ID')}</td>
        <td>${product.description}</td>
        <td>
            <!-- Tombol untuk membuka modal edit -->
            <button class="btn btn-update btn-sm" onclick="openEditModal(${product.id}, '${product.name}', ${product.price}, '${product.description}')">Update Product</button>
            <!-- Tombol untuk menghapus produk -->
            <button class="btn btn-delete btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
        </td>
    </tr>
`;

                });
            })
            .catch(error => console.error("Error fetching products:", error));
    }

    // Fungsi untuk menampilkan notifikasi di layar
    function showNotification(message, type = "success") {
        const notification = document.getElementById("notification");
        notification.innerHTML = message;
        notification.className = `alert alert-${type} text-center position-fixed top-0 start-50 translate-middle-x`;
        notification.style.display = "block";
        
        // Animasi muncul (fade in)
        notification.style.opacity = "0";
        setTimeout(() => { notification.style.opacity = "1"; }, 100);
    
        // Sembunyikan otomatis setelah 3 detik (fade out)
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => { notification.style.display = "none"; }, 500);
        }, 3000);
    }
    
    // Event listener untuk menangani submit formulir tambah produk
    productForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("productName").value;
        const price = document.getElementById("productPrice").value;
        const description = document.getElementById("productDescription").value;

        // Kirim data produk baru ke server menggunakan metode POST
        fetch("http://127.0.0.1:5000/product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price, description })
        })
        .then(response => response.json())
        .then(() => {
            fetchProducts(); // Perbarui daftar produk setelah berhasil ditambahkan
            productForm.reset(); // Reset form input
            let addModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            addModal.hide(); // Tutup modal tambah produk
            showNotification("Produk berhasil ditambahkan!", "success");
        });
    });

    // Fungsi untuk menghapus produk berdasarkan ID
    window.deleteProduct = (id) => {
        if (confirm("Are you sure you want to delete this product?")) {
            fetch(`http://127.0.0.1:5000/product/${id}`, { method: "DELETE" })
                .then(response => response.json())
                .then(() => fetchProducts()); // Perbarui daftar produk setelah dihapus
            
            showNotification("Produk berhasil dihapus!", "danger");
        }
    };

    // Fungsi untuk membuka modal edit dengan data produk yang dipilih
    window.openEditModal = (id, name, price, description) => {
        document.getElementById("editProductId").value = id;
        document.getElementById("editProductName").value = name;
        document.getElementById("editProductPrice").value = price;
        document.getElementById("editProductDescription").value = description;

        let editModal = new bootstrap.Modal(document.getElementById("editProductModal"));
        editModal.show();
    };

    // Fungsi untuk memperbarui produk yang diedit
    window.updateProduct = () => {
        const id = document.getElementById("editProductId").value;
        const name = document.getElementById("editProductName").value.trim();
        const price = parseInt(document.getElementById("editProductPrice").value);
        const description = document.getElementById("editProductDescription").value.trim();

        // Validasi input
        if (!name || isNaN(price) || !description) {
            alert("Please fill in all data correctly.");
            return;
        }

        // Kirim data produk yang diperbarui ke server menggunakan metode PUT
        fetch(`http://127.0.0.1:5000/product/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price, description })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("failed update product.");
            }
            return response.json();
        })
        .then(() => {
            fetchProducts(); // Perbarui daftar produk
            let editModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            editModal.hide(); // Tutup modal edit
            showNotification("Produk berhasil diperbarui!", "info");
        })
        .catch(error => {
            console.error("Error updating product:", error);
            alert("Eror Update Product.");
        });
    };

    // Memanggil fetchProducts saat halaman pertama kali dimuat
    fetchProducts();
});
