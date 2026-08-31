from django.db import models


class CustomerOrder(models.Model):
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    item_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name
