# Crear el backup PostgreSQL desde pgAdmin

`docs/supabase-inicializacion.sql` permite crear el esquema y los datos sintéticos de demostración desde Query Tool. No es un backup de la base de datos desplegada: para producir un respaldo real hace falta acceso al servidor y a la base concretos. No guardes un backup con información personal dentro del repositorio público.

## Exportar con pgAdmin

1. Abre pgAdmin y conéctate al servidor y base correctos. Verifica el nombre de la base en la barra de estado antes de continuar.
2. En el árbol, clic derecho sobre la base de datos → **Backup…**.
3. En **General**, selecciona una ruta fuera del repositorio, por ejemplo `Documents\PetLink-backup-AAAA-MM-DD.backup`.
4. Elige formato **Custom** para el archivo `.backup`. En **Dump Options**, incluye esquema y datos; conserva el resto de opciones predeterminadas salvo que tu profesor indique otra cosa.
5. Pulsa **Backup**, espera el resultado exitoso en el panel **Processes** y confirma que el archivo exista y tenga tamaño mayor que cero.
6. Guarda una copia en un medio privado distinto. Si contiene datos de personas, no la subas a GitHub ni la compartas públicamente.

## Restaurar para comprobar el archivo

Restaura en una base vacía de prueba, nunca sobre la única copia de la base original. Crea la base de prueba en pgAdmin, clic derecho sobre ella → **Restore…**, selecciona el archivo `.backup`, formato **Custom** y ejecuta. Luego inspecciona tablas y filas desde Query Tool. La restauración puede fallar si el rol destino no tiene privilegios sobre todos los objetos; en ese caso solicita permisos al propietario de la base, no elimines objetos para forzarla.

## Cargar el SQL de demostración en Query Tool

Para crear una base de estudio nueva, abre esa base en pgAdmin, selecciona **Tools → Query Tool**, carga `docs/supabase-inicializacion.sql` desde el botón de abrir archivo y pulsa ejecutar. El script crea tablas y filas de prueba con `IF NOT EXISTS`/upserts. No lo uses como reemplazo de una copia de seguridad de datos reales.
