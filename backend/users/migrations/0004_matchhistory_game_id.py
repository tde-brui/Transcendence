# Generated by Django 5.1.3 on 2025-01-08 11:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_matchhistory'),
    ]

    operations = [
        migrations.AddField(
            model_name='matchhistory',
            name='game_id',
            field=models.CharField(default='game_0', max_length=8),
        ),
    ]
