from decimal import Decimal, InvalidOperation

from django.shortcuts import render

from .models import CustomerOrder


def cart_view(request):
    saved_customer = None

    if request.method == "POST":
        full_name = (request.POST.get("full_name") or "").strip()
        phone = (request.POST.get("phone") or "").strip()
        address = (request.POST.get("address") or "").strip()
        city = (request.POST.get("city") or "").strip()
        country = (request.POST.get("country") or "").strip()
        notes = (request.POST.get("notes") or "").strip()
        item_total_raw = request.POST.get("item_total") or "0"

        if full_name and address:
            try:
                item_total = Decimal(item_total_raw)
            except InvalidOperation:
                item_total = Decimal("0.00")

            saved_customer = CustomerOrder.objects.create(
                full_name=full_name,
                phone=phone,
                address=address,
                city=city,
                country=country,
                item_total=item_total,
                notes=notes,
            )

    return render(request, "cart.html", {"saved_customer": saved_customer})
