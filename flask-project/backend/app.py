from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from marshmallow import ValidationError, fields
from flask_cors import CORS  

# Inisialisasi aplikasi Flask
app = Flask(__name__, template_folder="frontend/templates", static_folder="frontend/static")

# Konfigurasi database MySQL
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+mysqlconnector://root:@localhost/flask_db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Inisialisasi SQLAlchemy untuk ORM
db = SQLAlchemy(app)

# Inisialisasi Marshmallow untuk validasi data
ma = Marshmallow(app)

# Definisi model tabel produk
class Product(db.Model):
    __tablename__ = "tbl_product"

    id = db.Column(db.Integer, primary_key=True)  # Kolom ID sebagai primary key
    name = db.Column(db.String(100), nullable=False)  # Kolom nama produk
    price = db.Column(db.Float, nullable=False)  # Kolom harga produk
    description = db.Column(db.Text, nullable=False)  # Kolom deskripsi produk

    def __init__(self, name, price, description):
        self.name = name
        self.price = price
        self.description = description

# Definisi skema validasi untuk produk menggunakan Marshmallow
class ProductSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Product  # Menghubungkan dengan model Product

    id = fields.Integer(dump_only=True)  # Hanya untuk output (tidak diinput user)
    name = fields.String(
        required=True,
        validate=lambda x: len(x) >= 3,
        error_messages={"required": "Nama wajib diisi!", "validator_failed": "Nama minimal 3 karakter!"}
    )
    price = fields.Float(
        required=True,
        validate=lambda x: x > 0,
        error_messages={"required": "Harga wajib diisi!", "validator_failed": "Harga harus lebih dari 0!"}
    )
    description = fields.String(
        required=True,
        validate=lambda x: len(x) >= 5,
        error_messages={"required": "Deskripsi wajib diisi!", "validator_failed": "Deskripsi minimal 5 karakter!"}
    )

# Inisialisasi skema untuk satu produk dan banyak produk
product_schema = ProductSchema()
products_schema = ProductSchema(many=True)

# Fungsi untuk membentuk response JSON standar
def custom_response(status, messages, payload=None):
    return jsonify({
        "status": status,
        "messages": messages if isinstance(messages, list) else [messages],
        "payload": payload
    })

# Endpoint untuk halaman utama (menggunakan template index.html)
@app.route("/")
def home():
    return render_template("index.html")

# Endpoint untuk menambahkan produk baru (metode POST)
@app.route("/product", methods=["POST"])
def add_product():
    try:
        # Validasi input JSON menggunakan Marshmallow
        data = product_schema.load(request.json)
        new_product = Product(data["name"], data["price"], data["description"])

        # Simpan produk baru ke database
        db.session.add(new_product)
        db.session.commit()

        return custom_response(True, "Produk berhasil ditambahkan!", product_schema.dump(new_product)), 201
    except ValidationError as err:
        return custom_response(False, err.messages, None), 400

# Endpoint untuk mendapatkan semua produk (metode GET)
@app.route("/product", methods=["GET"])
def get_products():
    all_products = Product.query.all()  # Ambil semua produk dari database
    return custom_response(True, "", products_schema.dump(all_products))

# Endpoint untuk mendapatkan satu produk berdasarkan ID (metode GET)
@app.route("/product/<int:id>", methods=["GET"])
def get_product(id):
    product = Product.query.get(id)
    if not product:
        return custom_response(False, "Produk tidak ditemukan!", None), 404
    return custom_response(True, "", product_schema.dump(product))

# Endpoint untuk memperbarui produk berdasarkan ID (metode PUT)
@app.route("/product/<int:id>", methods=["PUT"])
def update_product(id):
    product = Product.query.get(id)
    if not product:
        return custom_response(False, "Produk tidak ditemukan!", None), 404

    try:
        # Validasi data yang dikirim oleh user
        data = product_schema.load(request.json)
        product.name = data["name"]
        product.price = data["price"]
        product.description = data["description"]

        db.session.commit()  # Simpan perubahan ke database
        return custom_response(True, "Produk berhasil diperbarui!", product_schema.dump(product))
    except ValidationError as err:
        return custom_response(False, err.messages, None), 400

# Endpoint untuk menghapus produk berdasarkan ID (metode DELETE)
@app.route("/product/<int:id>", methods=["DELETE"])
def delete_product(id):
    product = Product.query.get(id)
    if not product:
        return custom_response(False, "Produk tidak ditemukan!", None), 404

    db.session.delete(product)  # Hapus produk dari database
    db.session.commit()
    return custom_response(True, "Produk berhasil dihapus", None)

if __name__ == "__main__":
    app.run(debug=True)  
