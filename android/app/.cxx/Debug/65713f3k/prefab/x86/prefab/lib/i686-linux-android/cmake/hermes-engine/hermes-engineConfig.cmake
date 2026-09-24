if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/wrathcodetechnology/.gradle/caches/8.13/transforms/a94a7f554cba01d735392f6df9149b0b/transformed/jetified-hermes-android-0.79.2-debug/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/wrathcodetechnology/.gradle/caches/8.13/transforms/a94a7f554cba01d735392f6df9149b0b/transformed/jetified-hermes-android-0.79.2-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

