from django.urls import path

from . import views as VIEWER

urlpatterns = [
    path("", VIEWER.cart_view, name="cart"),
]
